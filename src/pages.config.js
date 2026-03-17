import Home from './pages/Home';
import ProjectView from './pages/ProjectView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "ProjectView": ProjectView,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};