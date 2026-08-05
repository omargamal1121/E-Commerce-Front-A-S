import React from "react";
import BulkDiscountManager from "../../components/products/BulkDiscountManager";
import { useTranslation } from "react-i18next";

const BulkDiscountPage = ({ token }) => {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Bulk Discount Management</h2>
      <p className="mb-6 text-gray-600">
        Apply discounts to multiple products at once. Select a discount and the products you want to apply it to.
      </p>
      
      {/* Bulk Discount Manager */}
      <BulkDiscountManager token={token} />
    </div>
  );
};

export default BulkDiscountPage;