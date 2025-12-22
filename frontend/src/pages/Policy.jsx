import React from "react";
import Navbar from "../components/Navbar";

const Policy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-30 text-black">
      <h1 className="text-4xl font-bold text-center mb-8">
        Return & Exchange Policy
      </h1>
      <ul className="list-disc pl-6 space-y-4 text-lg">
        <li>
          All returns, refunds and size exchanges must be done within a maximum
          of five days of receiving your product.
        </li>
        <li>
          We would like to inform you that as per our courier’s policy, opening
          the package upon delivery is not permitted. Unfortunately, this means
          you won’t be able to inspect or separate items upon receipt. Rest
          assured, we understand the importance of customer satisfaction. If,
          for any reason, you wish to return or exchange an item, you have a
          generous window of 5 days to reach out to us. Our dedicated customer
          service team will be more than happy to assist you with any concerns
          or requests.
        </li>
        <li>
          Reach out to us via DM or email in case you decided to
          return/exchange.
        </li>
        <li>
          All returns and exchanges for orders in Cairo will take place at our
          office in fifth settlement. We will not fulfill return and exchange
          order through the courier company unless the order is placed outside
          Cairo.
        </li>
        <li>
          Returned/exchanged items must be returned new, unused, unwashed and
          with all garment tags attached otherwise we won’t be able to neither
          return nor exchange the product.
        </li>
        <li>
          For return and exchange orders outside Cairo, the customer pays for
          the shipping fees of the item returning back to us in case of a
          return. In case of an exchange the clients pays for both return and
          forward items
        </li>
        <li>
          For international orders, it’s important to note that once your order
          arrives in your country, it may be subjected to customs regulations
          and fees, which are determined by your country’s rules and
          regulations. These additional charges are beyond our control and are
          the responsibility of the recipient.
        </li>
        <li>
          Exchange and returns are only allowed as long as the products are
          still in stock.
        </li>
      </ul>
    </div>
  );
};

export default Policy;
