<?php

// Functions invoked from DataSource.callback.php (in the context of Sitemagic)

function SMShopDeleteOrderEntries($orderId)
{
	$eDs = new SMDataSource("SMShopOrderEntries");

	if ($eDs->GetDataSourceType() === SMDataSourceType::$Xml)
		$eDs->Lock();

	$eDs->Delete("OrderId = '" . $eDs->Escape($orderId) . "'");
	$eDs->Commit(); // Also releases lock
}

function SMShopProcessNewOrder(SMKeyValueCollection $order)
{
	// Obtain order ID

	SMAttributes::Lock(); // Prevent two sessions from obtaining the same Order ID
	SMAttributes::Reload(false); // No data will be lost when reloading attributes from a callback since no extensions are being executed

	$orderIdStr = SMAttributes::GetAttribute("SMShopNextOrderId");
	$orderId = (($orderIdStr !== null) ? (int)$orderIdStr : 1);

	SMAttributes::SetAttribute("SMShopNextOrderId", (string)($orderId + 1));
	SMAttributes::Commit(); // Also releases lock

	// Load order entries

	$eDs = new SMDataSource("SMShopOrderEntries");
	$pDs = new SMDataSource("SMShopProducts");

	$products = null;
	$product = null;

	$discount = 0;
	$discountExpression = null;
	$expr = null;
	$price = 0;

	$priceTotal = 0;
	$vatTotal = 0;

	if ($eDs->GetDataSourceType() === SMDataSourceType::$Xml)
		$eDs->Lock();

	$entries = $eDs->Select("*", "OrderId = '" . $eDs->Escape($order["Id"]) . "'");

	foreach ($entries as $entry)
	{
		// Get product associated with entry

		$products = $pDs->Select("*", "Id = '" . $entry["ProductId"] . "'");

		if (count($products) === 0) // Very unlikely to happen, but theoretically possible
		{
			header("HTTP/1.1 500 Internal Server Error");
			echo "Product with ID '" . $entry["ProductId"] . "' has been removed";
			exit;
		}

		$product = $products[0];

		// Get discount expression

		$discount = 0;
		$discountExpression = $product["DiscountExpression"];

		if ($discountExpression !== "")
		{
			// Security validation

			//$discountExpression = preg_replace("/Math\\.[a-z]+/i", "", $discountExpression);
			$discountExpression = preg_replace("/ |[0-9]|\\*|\\+|\\-|\\/|=|&|\\||!|\\.|:|\\(|\\)|>|<|\\?|true|false/", "", $discountExpression);
			$discountExpression = preg_replace("/units|price|vat|currency|weight|weightunit/", "", $discountExpression);

			if ($discountExpression !== "") // All valid elements were removed above, so if $discountExpression contains anything, it is potentially a security threat
			{
				header("HTTP/1.1 500 Internal Server Error");
				echo "Invalid and potentially insecure DiscountExpression detected";
				exit;
			}

			// Make variables available to discount expression

			$expr = "";
			$expr .= "\nunits = " . $entry["Units"] . ";";
			$expr .= "\nprice = " . $product["Price"] . ";";
			$expr .= "\nvat = " . $product["Vat"] . ";";
			$expr .= "\ncurrency = \"" . $product["Currency"] . "\";";
			$expr .= "\nweight = " . $product["Weight"] . ";";
			$expr .= "\nweightunit = \"" . $product["WeightUnit"] . "\";";
			$expr .= "\nreturn (" . $product["DiscountExpression"] . ");";

			// Turn JS variables into PHP compliant variables

			$expr = str_replace("units", "\$units", $expr);
			$expr = str_replace("price", "\$price", $expr);
			$expr = str_replace("vat", "\$vat", $expr);
			$expr = str_replace("currency", "\$currency", $expr);
			$expr = str_replace("weight", "\$weight", $expr); // $weight AND $weightunit (both starts with "weight")

			// Evaluate discount expression, and calculate price and VAT

			$discount = eval($expr);

			if (is_numeric($discount) === false)
			{
				header("HTTP/1.1 500 Internal Server Error");
				echo "DiscountExpression did not result in a valid numeric value";
				exit;
			}

			$price = ((int)$entry["Units"] * (float)$product["Price"]) - $discount;

			$priceTotal += $price;
			$vatTotal += $price * ((float)$product["Vat"] / 100);
		}

		// Update entry

		$entry["OrderId"] = (string)$orderId;
		$entry["UnitPrice"] = $product["Price"];
		$entry["Vat"] = $product["Vat"];
		$entry["Currency"] = $product["Currency"];
		$entry["Discount"] = (string)$discount;
		$entry["DiscountMessage"] = $product["DiscountMessage"];

		$eDs->Update($entry, "Id = '" . $eDs->Escape($entry["Id"]) . "'");
	}

	$eDs->Commit();

	// Update order details

	$order["Id"] = (string)$orderId;
	$order["Price"] = (string)$priceTotal;
	$order["Vat"] = (string)$vatTotal;
}

?>
