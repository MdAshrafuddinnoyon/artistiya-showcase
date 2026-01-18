import CMSPage from "@/components/content/CMSPage";

const About = () => {
  return (
    <CMSPage
      pageKey="about"
      eyebrow="Our Story"
      fallbackTitle="About Us"
      fallbackDescription="Learn about our story, values, and craftsmanship."
    />
  );
};

export default About;
