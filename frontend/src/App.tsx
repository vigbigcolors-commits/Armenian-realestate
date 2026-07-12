import { Routes, Route } from "react-router-dom";
import { useI18n } from "./i18n";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import PropertyPage from "./pages/PropertyPage";
import RealtorsPage from "./pages/RealtorsPage";
import ProRoomPage from "./pages/ProRoomPage";
import BuyersPage from "./pages/BuyersPage";
import PostListingPage from "./pages/PostListingPage";
import SellerAccountPage from "./pages/SellerAccountPage";

export default function App() {
  const { t } = useI18n();

  return (
    <div className="site-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/property/:id" element={<PropertyPage />} />
          <Route path="/realtors" element={<RealtorsPage />} />
          <Route path="/pro" element={<ProRoomPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/post" element={<PostListingPage />} />
          <Route path="/account" element={<SellerAccountPage />} />
        </Routes>
      </main>
      <footer className="band band-footer border-t border-white/[0.06] py-8 text-center">
        <div className="site-container">
          <div className="partner-note">
            <p className="partner-note-title">{t("partnerTitle")}</p>
            <p className="partner-note-body">{t("partnerBody")}</p>
          </div>
          <p className="text-xs text-white/30">{t("footer")}</p>
        </div>
      </footer>
    </div>
  );
}
