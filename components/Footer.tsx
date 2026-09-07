"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { SocialIcon } from "./SocialIcon";
import { footerLinks } from "@/lib/data/navigation";
import styles from "./Footer.module.css";

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div>
      <h2 className="footer-heading hidden md:block">{title}</h2>
      <h2 className="md:hidden">
        <button
          type="button"
          className={`footer-heading ${styles.toggle}`}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
        >
          {title}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </h2>
      <ul
        id={contentId}
        className={`m-0 list-none p-0 md:block ${open ? "block" : "hidden"}`}
      >
        {children}
      </ul>
    </div>
  );
}

export function Footer() {
  const sections = [
    { title: "Information", links: footerLinks.information },
    { title: "Policies", links: footerLinks.policies },
  ];

  return (
    <footer className="site-footer mt-auto bg-white">
      <div className={`container-ylw footer-main ${styles.main}`}>
        <div className={`grid grid-cols-1 md:grid-cols-4 ${styles.columns}`}>
          {sections.map((section) => (
            <FooterSection key={section.title} title={section.title}>
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={`https://www.yellowclothing.net${link.href}`}
                    className="footer-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterSection>
          ))}
          <FooterSection title="Customer Service">
            <li>
              <a
                href={`tel:${footerLinks.customerService.phone}`}
                className="footer-link"
              >
                {footerLinks.customerService.phone}
              </a>
            </li>
            <li className="footer-link">{footerLinks.customerService.hours}</li>
            <li>
              <a
                href={`mailto:${footerLinks.customerService.email}`}
                className="footer-link"
              >
                {footerLinks.customerService.email}
              </a>
            </li>
          </FooterSection>
          <div className={`footer-social ${styles.social}`}>
            {footerLinks.social.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={social.label}
              >
                <SocialIcon name={social.label} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className={`container-ylw footer-bottom ${styles.bottom}`}>
        <p className="m-0 text-[12px] tracking-[0.02em] text-ylw-text">
          © 2026 Yellow Clothing Ltd. | All Rights Reserved.
        </p>
        <Image
          src="/images/payment-methods.jpg"
          alt="Payment Methods"
          width={300}
          height={65}
          sizes="(max-width: 767px) 190px, 300px"
          className={`h-auto w-[300px] max-w-full ${styles.payment}`}
        />
      </div>
    </footer>
  );
}
