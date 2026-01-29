import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliverySlipRequest {
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

    const { orderId }: DeliverySlipRequest = await req.json();
    console.log(`Generating delivery slip for order: ${orderId}`);

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

    // Fetch invoice settings for company info
    const { data: settings } = await supabase
      .from("invoice_settings")
      .select("*")
      .limit(1)
      .single();

    const invoiceSettings = settings || {
      company_name: "artistiya.store",
      company_address: "Dhaka, Bangladesh",
      company_phone: "+880 1XXX-XXXXXX",
    };

    const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    // Generate items list
    const itemsList = order.order_items.map((item: any) => 
      `<tr>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #ccc;">${item.product_name}</td>
        <td style="padding: 6px 8px; border-bottom: 1px dashed #ccc; text-align: center; font-weight: bold;">${item.quantity}</td>
      </tr>`
    ).join("");

    // Calculate total items
    const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    const deliverySlipHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Delivery Slip - ${order.order_number}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: 100mm 150mm; margin: 5mm; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      width: 100mm;
      margin: 0 auto;
      padding: 10px;
      background: #fff;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #D4AF37;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 18px;
      color: #D4AF37;
      margin: 0 0 5px 0;
    }
    .header p {
      margin: 2px 0;
      font-size: 10px;
      color: #666;
    }
    .order-info {
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .order-info h2 {
      font-size: 14px;
      margin: 0 0 5px 0;
      color: #D4AF37;
    }
    .order-info p {
      margin: 2px 0;
      font-size: 11px;
    }
    .customer-section {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .customer-section h3 {
      font-size: 12px;
      margin: 0 0 5px 0;
      color: #D4AF37;
      text-transform: uppercase;
    }
    .customer-section .name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .customer-section .phone {
      font-size: 14px;
      font-weight: bold;
      color: #D4AF37;
    }
    .items-section h3 {
      font-size: 12px;
      margin: 0 0 5px 0;
      color: #D4AF37;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    th {
      background: #1a1a1a;
      color: #D4AF37;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
    }
    th:last-child { text-align: center; }
    .summary {
      background: #1a1a1a;
      color: #fff;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }
    .summary .amount {
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
    }
    .summary .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cod-badge {
      display: inline-block;
      background: #D4AF37;
      color: #000;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 10px;
      margin-top: 5px;
    }
    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    .barcode-area {
      text-align: center;
      padding: 10px;
      margin-top: 10px;
      border: 1px dashed #ccc;
      font-family: monospace;
      font-size: 14px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${invoiceSettings.company_name}</h1>
    <p>${invoiceSettings.company_phone}</p>
  </div>

  <div class="order-info">
    <h2>📦 Order #${order.order_number}</h2>
    <p><strong>Date:</strong> ${orderDate}</p>
    <p><strong>Items:</strong> ${totalItems} piece(s)</p>
    ${order.payment_method === 'cod' ? '<span class="cod-badge">💵 CASH ON DELIVERY</span>' : '<p><strong>Payment:</strong> ' + order.payment_method.toUpperCase() + ' (Paid)</p>'}
  </div>

  <div class="customer-section">
    <h3>📍 Deliver To</h3>
    <p class="name">${order.address?.full_name || 'Customer'}</p>
    <p class="phone">📞 ${order.address?.phone || 'N/A'}</p>
    <p>
      ${order.address?.address_line || ''}<br>
      ${order.address?.thana || ''}, ${order.address?.district || ''}<br>
      ${order.address?.division || ''}
    </p>
  </div>

  <div class="items-section">
    <h3>📋 Items</h3>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="label">${order.payment_method === 'cod' ? 'Amount to Collect' : 'Order Total'}</div>
    <div class="amount">৳${order.total.toLocaleString()}</div>
    ${order.payment_method === 'cod' ? '' : '<div class="label" style="color: #4ade80;">✓ PAID</div>'}
  </div>

  <div class="barcode-area">
    ${order.order_number}
  </div>

  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p>${invoiceSettings.company_name}</p>
  </div>
</body>
</html>
    `;

    console.log("Delivery slip generated successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      html: deliverySlipHtml,
      order_number: order.order_number 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating delivery slip:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
