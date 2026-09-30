import React from "react";
import Title from "../components/Title";

const Policy = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  return (
    <div className="mt-[80px] mb-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
        className="text-2xl text-center pt-10 border-t border-gray-200"
      >
        <Title text1="RETURN &amp;" text2="EXCHANGE POLICY" />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="max-w-4xl mx-auto mt-12 space-y-10 text-gray-700 leading-relaxed"
      >
        <motion.p variants={itemVariants} className="text-base sm:text-lg">
          At <strong className="text-[#29251F]">R&amp;S Fashion Wear</strong>, we want you to be satisfied with your purchase. You may request a return or exchange within <strong className="text-[#6B705C]">14 days of receiving your order</strong>, subject to the conditions below.
        </motion.p>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Opening the Package</h2>
          <p className="text-base sm:text-lg">
            Customers are <strong className="text-[#6B705C]">allowed to open and inspect the package upon delivery</strong> to make sure that the received items are correct and in acceptable condition.
          </p>
          <p className="text-base sm:text-lg">
            Opening the package does not affect your eligibility for a return or exchange, provided that the item remains in its original condition and meets the conditions stated below.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Exchange</h2>
          <p className="text-base sm:text-lg">
            Exchange requests must be submitted within <strong className="text-[#6B705C]">14 days of receiving the order</strong>.
          </p>
          <p className="text-base sm:text-lg font-semibold text-[#29251F]">To be eligible for an exchange, the item must:</p>
          <ul className="list-disc pl-6 space-y-2 text-base sm:text-lg">
            <li>Be unused and unwashed.</li>
            <li>Be undamaged and in its original condition.</li>
            <li>Have its original packaging, tags, and accessories, if applicable.</li>
          </ul>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Returns</h2>
          <p className="text-base sm:text-lg">
            Return requests must be submitted within <strong className="text-[#6B705C]">14 days of receiving the order</strong>.
          </p>
          <p className="text-base sm:text-lg font-semibold text-[#29251F]">To be eligible for a return, the item must:</p>
          <ul className="list-disc pl-6 space-y-2 text-base sm:text-lg">
            <li>Be unused and unwashed.</li>
            <li>Be undamaged and in its original condition.</li>
            <li>Have its original packaging, tags, and accessories, if applicable.</li>
          </ul>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Washing &amp; Care</h2>
          <p className="text-base sm:text-lg">
            To keep your garment looking its best, please follow the <strong className="text-[#6B705C]">washing and care instructions provided on the garment's care label</strong>.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Damaged or Incorrect Items</h2>
          <p className="text-base sm:text-lg">
            If you receive a <strong className="text-[#6B705C]">damaged, defective, or incorrect item</strong>, please contact us as soon as possible after receiving your order.
          </p>
          <p className="text-base sm:text-lg">
            Please provide your <strong className="text-[#29251F]">order number</strong> and, where applicable, clear photos of the item and the issue. We will review the case and provide an appropriate solution.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Shipping Fees</h2>
          <p className="text-base sm:text-lg">
            Return or exchange shipping fees may apply depending on the reason for the request.
          </p>
          <p className="text-base sm:text-lg">
            If the return or exchange is due to receiving a <strong className="text-[#6B705C]">damaged, defective, or incorrect item</strong>, R&amp;S Fashion Wear will review the case and determine the applicable shipping arrangements.
          </p>
          <p className="text-base sm:text-lg">
            For other return or exchange requests, any applicable shipping fees will be communicated to the customer before processing the request.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">Refunds</h2>
          <p className="text-base sm:text-lg">
            For approved returns, the refund will be processed after the returned item has been received and inspected.
          </p>
          <p className="text-base sm:text-lg">
            The refund method and processing time may vary depending on the original payment method. Any applicable refund details will be communicated to the customer during the return process.
          </p>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="space-y-4 bg-[#F5F1E8]/60 border border-[#B89B62]/30 rounded-xl p-6 sm:p-8"
        >
          <h2 className="text-lg sm:text-xl font-bold text-[#29251F] font-serif-title">How to Request a Return or Exchange</h2>
          <p className="text-base sm:text-lg">
            To request a return or exchange, please contact us through:
          </p>
          <div className="space-y-3 text-base sm:text-lg pl-2">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-[#6B705C]">Phone:</span>
              <a href="tel:01555522161" className="font-semibold text-[#29251F] hover:text-[#B89B62] transition-colors">
                01555522161
              </a>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-[#6B705C]">Email:</span>
              <a href="mailto:r.s.store.0012@gmail.com" className="font-semibold text-[#29251F] hover:text-[#B89B62] transition-colors break-all">
                r.s.store.0012@gmail.com
              </a>
            </p>
          </div>
          <p className="text-base sm:text-lg pt-2 font-semibold text-[#29251F]">Please include:</p>
          <ul className="list-disc pl-6 space-y-2 text-base sm:text-lg">
            <li>Your order number.</li>
            <li>The reason for the return or exchange.</li>
            <li>Photos of the item, if the item is damaged, defective, or incorrect.</li>
          </ul>
        </motion.section>

        <motion.p variants={itemVariants} className="text-sm sm:text-base text-gray-500 italic border-t border-gray-200 pt-6">
          We reserve the right to reject return or exchange requests that do not meet the conditions stated above, subject to applicable laws and customer rights.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Policy;
