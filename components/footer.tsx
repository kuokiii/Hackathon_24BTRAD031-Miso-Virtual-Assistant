"use client"

import Link from "next/link"
import { Github, Instagram, Twitter, Linkedin, Heart } from "lucide-react"
import CherryBlossomIcon from "./cherry-blossom-icon"
import { motion } from "framer-motion"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    { icon: <Instagram className="h-5 w-5" />, href: "https://instagram.com/_kuoki/", label: "Instagram" },
    { icon: <Github className="h-5 w-5" />, href: "https://github.com/kuokiii", label: "GitHub" },
    { icon: <Twitter className="h-5 w-5" />, href: "#", label: "Twitter" },
    { icon: <Linkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
  ]

  return (
    <footer className="py-12 px-4 md:px-6 lg:px-8 border-t border-primary/10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CherryBlossomIcon className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">Miso</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Your intelligent virtual assistant with voice and text capabilities.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-muted-foreground hover:text-primary transition-colors">
                  Chat with Miso
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((link, index) => (
                <motion.div key={index} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label={link.label}
                  >
                    {link.icon}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} Miso. All rights reserved.</p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}>
              <Heart className="h-4 w-4 text-primary" />
            </motion.div>
            <span>by Nirupam Thapa aka kuoki</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

