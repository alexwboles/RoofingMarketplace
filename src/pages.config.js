/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import BidSubmission from './pages/BidSubmission';
import Home from './pages/Home';
import HomeownerDashboard from './pages/HomeownerDashboard';
import ProjectView from './pages/ProjectView';
import QuoteResult from './pages/QuoteResult';
import RooferDashboard from './pages/RooferDashboard';
import RooferProfile from './pages/RooferProfile';
import RooferSignup from './pages/RooferSignup';
import RoofersList from './pages/RoofersList';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BidSubmission": BidSubmission,
    "Home": Home,
    "HomeownerDashboard": HomeownerDashboard,
    "ProjectView": ProjectView,
    "QuoteResult": QuoteResult,
    "RooferDashboard": RooferDashboard,
    "RooferProfile": RooferProfile,
    "RooferSignup": RooferSignup,
    "RoofersList": RoofersList,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};