import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CategoryNavbar from './CategoryNavbar';
import Footer from './Footer';
import BackToTop from './BackToTop';
import WhatsAppButton from './WhatsAppButton';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <CategoryNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <BackToTop />
    <WhatsAppButton />
  </div>
);

export default MainLayout;
