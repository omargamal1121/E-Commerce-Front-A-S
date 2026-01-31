import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ViewProduct from "../../components/products/ViewProduct";

const ProductDetails = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Product Details</h1>
        <button
          type="button"
          onClick={() => navigate(`/products/${id}/variants`)}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Manage Variants
        </button>
      </div>
      <ViewProduct token={token} productId={id} />
    </div>
  );
};

export default ProductDetails;
