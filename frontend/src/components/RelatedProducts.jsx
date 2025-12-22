import React, { useContext, useState, useEffect } from "react";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { ShopContext } from "../context/ShopContext";
const RelatedProducts = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      let productsData = products.filter(
        (item) => item.category === category && item.subCategory === subCategory
      );
      setRelatedProducts(productsData.slice(0, 4));
    }
  }, [products]);

  return (
    <div className="my-24">
      <div className="text-left text-3xl py-2">
        <Title text1="RELATED" text2="PRODUCTS" />
        <p className="text-gray-500 text-lg mt-2">
          Combine your style with these products
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-6">
        {relatedProducts.map((item, index) => {
          return (
            <ProductItem
              key={index}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
              finalPrice={item.finalPrice}
              discountPrecentage={item.discountPrecentage}
              discountName={item.discountName}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
