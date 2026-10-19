import { createBrowserRouter } from "react-router-dom";
import ProductsPage from "./pages/Products";
import { AddProductForm } from "./pages/AddProductForm";

export const router = createBrowserRouter([

    { index: true, element: <ProductsPage /> },
    { path: 'create', element: <AddProductForm /> }
])