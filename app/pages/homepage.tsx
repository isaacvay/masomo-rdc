import React from 'react'
import Hero from '../components/homeComp/hero/Hero';
import Features from '../components/homeComp/features/Features';
import WhyChooseMasomo from '../components/homeComp/whyChooseMasomo/WhyChooseMasomo';
import SecuritySection from '../components/homeComp/securitySection/SecuritySection';
import DemoPreview from '../components/homeComp/demo/DemoPreview';
import SchoolCarousel from '../components/homeComp/carousel/SchoolCarousel';
import FAQ from '../components/homeComp/faq/FAQ';
import Footer from '../components/footer/Footer';



function Homepage() {
  return (
    <>
    
   
    <Hero/>
    <Features/>
    <WhyChooseMasomo/>
    <SecuritySection />
    <SchoolCarousel />
    
    <FAQ />
    <DemoPreview />
   <Footer/>
    </>
  );
}

export default Homepage;