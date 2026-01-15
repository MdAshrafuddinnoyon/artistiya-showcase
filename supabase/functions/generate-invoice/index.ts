import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId }: InvoiceRequest = await req.json();
    console.log(`Generating invoice for order: ${orderId}`);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        address:addresses (*),
        order_items (*)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Fetch invoice settings
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    const invoiceSettings = settings || {
      company_name: "artistiya.store",
      company_address: "Dhaka, Bangladesh",
      company_email: "hello@artistiya.store",
      company_phone: "+880 1XXX-XXXXXX",
      logo_url: null,
      footer_note: "Thank you for your purchase!",
      terms_and_conditions: "All items are handcrafted and may have slight variations."
    };

    // Generate invoice HTML
    const invoiceDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">৳${item.product_price.toLocaleString()}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">৳${(item.product_price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join("");

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #D4AF37;
    }
    .logo-section h1 {
      font-size: 28px;
      color: #D4AF37;
      margin: 0;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 24px;
      color: #333;
      margin: 0 0 10px 0;
    }
    .billing-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .billing-box {
      width: 48%;
    }
    .billing-box h3 {
      color: #D4AF37;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #1a1a1a;
      color: #D4AF37;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) {
      text-align: right;
    }
    th:nth-child(2) { text-align: center; }
    .totals {
      width: 300px;
      margin-left: auto;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .totals-row.grand-total {
      border-bottom: none;
      border-top: 2px solid #D4AF37;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #D4AF37;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #666;
    }
    .terms {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      ${invoiceSettings.logo_url ? `<img src="${invoiceSettings.logo_url}" alt="Logo" style="max-height: 60px;">` : ''}
      <h1>${invoiceSettings.company_name}</h1>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        ${invoiceSettings.company_address}<br>
        ${invoiceSettings.company_email}<br>
        ${invoiceSettings.company_phone}
      </p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> INV-${order.order_number}</p>
      <p><strong>Order #:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${invoiceDate}</p>
      <p><strong>Order Date:</strong> ${orderDate}</p>
    </div>
  </div>

  <div class="billing-section">
    <div class="billing-box">
      <h3>Bill To</h3>
      <p>
        <strong>${order.address?.full_name || 'Customer'}</strong><br>
        ${order.address?.address_line || ''}<br>
        ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
        ${order.address?.division || ''}<br>
        Phone: ${order.address?.phone || 'N/A'}
      </p>
    </div>
    <div class="billing-box">
      <h3>Payment Info</h3>
      <p>
        <strong>Method:</strong> ${order.payment_method.toUpperCase()}<br>
        <strong>Status:</strong> ${order.status?.toUpperCase() || 'PENDING'}<br>
        ${order.payment_transaction_id ? `<strong>Transaction ID:</strong> ${order.payment_transaction_id}` : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>৳${order.subtotal.toLocaleString()}</span>
    </div>
    <div class="totals-row">
      <span>Shipping:</span>
      <span>৳${order.shipping_cost.toLocaleString()}</span>
    </div>
    <div class="totals-row grand-total">
      <span>Total:</span>
      <span>৳${order.total.toLocaleString()}</span>
    </div>
  </div>

  ${invoiceSettings.terms_and_conditions ? `
  <div class="terms">
    <strong>Terms & Conditions:</strong><br>
    ${invoiceSettings.terms_and_conditions}
  </div>
  ` : ''}

  <div class="footer">
    <p style="text-align: center; font-size: 14px; color: #D4AF37;">
      ${invoiceSettings.footer_note}
    </p>
    <p style="text-align: center;">
      This is a computer-generated invoice. No signature required.
    </p>
  </div>
</body>
</html>
    `;

    console.log("Invoice HTML generated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      html: invoiceHtml,
      order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
