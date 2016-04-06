<?php

require_once(dirname(__FILE__) . "/../PSPI/PSPInterface.php");

// Security

if ($SMCallback !== true)
{
	echo "Unauthorized!"; // Not executed in the context of Sitemagic
	exit;
}

// Helper function(s)

function getOrder($orderId)
{
	$ds = new SMDataSource("SMShopOrders");
	$orders = $ds->Select("*", "Id = '" . $ds->Escape($orderId) . "'");

	if (count($orders) !== 1) // Unlikely, but could happen if user calls URL with an incorrect OrderId
	{
		header("HTTP/1.1 500 Internal Server Error");
		echo "Order with ID '" . $orderId . "' could not be found";
		exit;
	}

	return $orders[0];
}

// Payment handling.
// Step 1: User is redirected to payment form.
// Step 2: PSP invokes callback to let us know payment was received.

$operation = SMEnvironment::GetQueryValue("PaymentOperation");

if ($operation === null) // Step 1: Redirect to payment window
{
	$orderId = SMEnvironment::GetQueryValue("OrderId");
	$order = getOrder($orderId);

	$amount = (int)round(((float)$order["Price"] + (float)$order["Vat"]) * 100); // Amount in smallest possible unit (e.g. USD 10095 = USD 100.95)
	$currency = $order["Currency"];

	$continueUrl = SMEnvironment::GetExternalUrl();
	$continueUrl .= ((SMAttributes::GetAttribute("SMShopReceiptPage") !== null && SMAttributes::GetAttribute("SMShopReceiptPage") !== "") ? "/" . SMAttributes::GetAttribute("SMShopReceiptPage") : "");
	$callbackUrl = SMEnvironment::GetExternalUrl() . "/" . SMExtensionManager::GetCallbackUrl(SMExtensionManager::GetExecutingExtension(), "Callbacks/Payment") . "&PaymentOperation=Auth";

	$p = PSP::GetPaymentProvider($order["PaymentMethod"]);
	$p->RedirectToPaymentForm($orderId, $amount, $currency, $continueUrl, $callbackUrl);
}
else if ($operation === "Auth") // Step 2: Handle response from PSP - Callback invoked through PSPI
{
	$data = PSP::GetCallbackData(); // Securely obtain data passed to callback

	$transactionId = $data["TransactionId"];	// String
	$orderId = $data["OrderId"];				// String
	//$amount = $data["Amount"];				// Integer
	//$currency = $data["Currency"];			// String

	$order = getOrder($orderId);

	$order["TransactionId"] = $transactionId;
	$order["State"] = "Authorized";

	$ds = new SMDataSource("SMShopOrders");
	$ds->Lock();
	$ds->Update($order, "Id = '" . $ds->Escape($order["Id"]) . "'");
	$ds->Commit();
}

?>
