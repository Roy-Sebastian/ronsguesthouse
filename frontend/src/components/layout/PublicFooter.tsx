import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 text-gray-600 font-sans border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Brand & Intro */}
          <div className="md:col-span-1 flex flex-col items-start pr-0 md:pr-4">
            <Link href="/" className="font-serif text-2xl tracking-widest text-gray-900 uppercase inline-block mb-6">
              Ron's <span className="text-red-800">Guest House</span>
            </Link>
            <p className="text-sm font-light leading-relaxed mb-8">
              Experience the pinnacle of hospitality where classic elegance meets modern luxury. Your perfect sanctuary awaits.
            </p>
            <a 
              href="#" 
              className="inline-block bg-gray-900 text-white text-xs font-bold px-6 py-2 rounded mb-6 hover:bg-black transition-colors"
            >
              Booking.com
            </a>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <h4 className="text-gray-900 font-serif tracking-widest uppercase mb-6 text-sm">COMPANY</h4>
            <ul className="space-y-4 text-sm font-light">
              <li><Link href="/about" className="hover:text-red-800 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">Legal Information</Link></li>
              <li><Link href="/contact" className="hover:text-red-800 transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">Blogs</Link></li>
            </ul>
          </div>

          {/* Help Center */}
          <div className="md:col-span-1">
            <h4 className="text-gray-900 font-serif tracking-widest uppercase mb-6 text-sm">HELP CENTER</h4>
            <ul className="space-y-4 text-sm font-light">
              <li><Link href="#" className="hover:text-red-800 transition-colors">Find a Property</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">How To Host?</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">Why Us?</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">FAQs</Link></li>
              <li><Link href="#" className="hover:text-red-800 transition-colors">Rental Guides</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-1 flex flex-col">
            <h4 className="text-gray-900 font-serif tracking-widest uppercase mb-6 text-sm">CONTACT INFO</h4>
            <ul className="space-y-4 text-sm font-light mb-8">
              <li>Phone: +62 811 1234 5678</li>
              <li>Email: info@ronsguesthouse.com</li>
              <li>Location: Jl. Perwira Gg. Kaliaga No.5, Gundaling I, Kec. Berastagi, Kabupaten Karo, Sumatera Utara 22156</li>
            </ul>
            <div className="flex space-x-4 mt-auto">
              <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-light tracking-wider">
          <p>&copy; {new Date().getFullYear()} Ron's Guest House | All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
