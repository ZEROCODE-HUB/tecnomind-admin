import { 
  Navbar, 
  HeroSection, 
  ValueProps, 
  SolutionsSection, 
  Footer 
} from "@/components/landing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ValueProps />
        <SolutionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
