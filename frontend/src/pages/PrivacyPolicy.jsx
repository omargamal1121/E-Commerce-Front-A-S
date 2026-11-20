import React from "react";
import Title from "../components/Title";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <div className="pt-32 sm:pt-36 pb-20 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] bg-[var(--bg)] text-[var(--text)] min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl text-center pb-8 border-b border-[var(--border)]"
      >
        <Title text1="PRIVACY" text2="POLICY" />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
        variants={containerVariants}
        className="max-w-4xl mx-auto mt-10 space-y-8 text-[var(--text)] leading-relaxed"
      >
        <motion.div variants={itemVariants} className="space-y-2">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-[var(--text-muted)] font-semibold">
            Last updated: November 2026
          </p>
          <p className="text-base sm:text-lg">
            At <strong className="text-[var(--text)]">R&amp;S Fashion Wear</strong>, we respect your privacy and are committed to protecting your personal data.
          </p>
        </motion.div>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Data We Collect</h2>
          <p className="text-base sm:text-lg">
            Your name, phone number, email address, age, delivery address, and the sizes and measurements of the products you order.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">How We Use It</h2>
          <p className="text-base sm:text-lg">
            To create your account, process and deliver your orders, and contact you about your account and orders.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Payment</h2>
          <p className="text-base sm:text-lg">
            Online payments are processed entirely by Paymob. We do not see or store your card details (card number or CVV).
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Data Sharing</h2>
          <p className="text-base sm:text-lg">
            We do not sell your data or share it for marketing purposes. We share it only with the service providers needed to run the store (the Paymob payment gateway, our email service, and image hosting), or when required by law.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Security</h2>
          <p className="text-base sm:text-lg">
            Passwords are stored in encrypted form, and the website uses HTTPS.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Data Retention &amp; Account Deletion</h2>
          <p className="text-base sm:text-lg">
            We keep order and payment records for as long as the law requires. You can ask us to delete your account and data by contacting us.
          </p>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Usage</h2>
          <p className="text-base sm:text-lg">
            This website is intended for people aged 18 and over. By using the website, you agree to this policy.
          </p>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="space-y-3 bg-[var(--surface)]/60 border border-[var(--accent)]/30 rounded-xl p-6 sm:p-8"
        >
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-serif-title">Contact</h2>
          <div className="space-y-2 text-base sm:text-lg pl-2">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-[var(--text-muted)]">Address:</span>
              <span className="font-semibold text-[var(--text)]">Cairo, Egypt</span>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-[var(--text-muted)]">Email:</span>
              <a
                href="mailto:r.s.store.0012@gmail.com"
                className="font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors break-all"
              >
                r.s.store.0012@gmail.com
              </a>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-[var(--text-muted)]">Phone:</span>
              <a
                href="tel:01555522161"
                className="font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
              >
                01555522161
              </a>
            </p>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
