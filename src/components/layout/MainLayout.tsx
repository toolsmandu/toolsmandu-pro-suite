import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CategoryNavbar from './CategoryNavbar';
import Footer from './Footer';
import BackToTop from './BackToTop';

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <CategoryNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <BackToTop />
  </div>
);

export default MainLayout;
