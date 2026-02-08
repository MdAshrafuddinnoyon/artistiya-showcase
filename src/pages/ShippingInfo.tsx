import CMSPage from "@/components/content/CMSPage";

const ShippingInfo = () => {
  return (
    <CMSPage
      pageKey="shipping-info"
      eyebrow="Delivery"
      fallbackTitle="Shipping Information"
      fallbackDescription="Learn about our shipping policies, delivery times, and charges."
    />
  );
};

export default ShippingInfo;
