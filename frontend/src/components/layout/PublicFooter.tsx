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
              href="https://www.booking.com/hotel/id/rons-guest-house-berastagi.id.html?aid=318615&label=English_Indonesia_EN_ID_28546570705-G6blYurG1wv5nxy_NQuKzQS634117825086%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atidsa-209721654025%3Alp9121598%3Ali%3Adec%3Adm%3Aag28546570705%3Acmp340122265&sid=f5fc3dbbcbe7885739a87ec632ac344d&dest_id=-2673007&dest_type=city&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1775286493&srpvid=e26e322a608600cc&type=total&ucfs=1&"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#003580] text-white text-xs font-bold px-6 py-2.5 rounded shadow-sm hover:bg-[#00224f] transition-colors"
            >
              Book on Booking.com
            </a>
          </div>

          {/* Company */}
          <div className="md:col-span-1">
            <h4 className="text-gray-900 font-serif tracking-widest uppercase mb-6 text-sm">COMPANY</h4>
            <ul className="space-y-4 text-sm font-light">
              <li><Link href="/about" className="hover:text-red-800 transition-colors">About Us</Link></li>
              <li><Link href="/rooms" className="hover:text-red-800 transition-colors">Our Rooms</Link></li>
              <li><Link href="/search" className="hover:text-red-800 transition-colors">Search Booking</Link></li>
              <li><Link href="/contact" className="hover:text-red-800 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Social / Empty col for spacing */}
          <div className="md:col-span-1 flex flex-col">
          </div>

          {/* Contact Details */}
          <div className="md:col-span-1 flex flex-col">
            <h4 className="text-gray-900 font-serif tracking-widest uppercase mb-6 text-sm">CONTACT INFO</h4>
            <ul className="space-y-4 text-sm font-light mb-8">
              <li>Phone: +62 852-7158-2388</li>
              <li>Email: eidimakarhs@yahoo.com</li>
              <li>Location: Jl. Perwira Gg. Kaliaga No.5, Gundaling I, Kec. Berastagi, Kabupaten Karo, Sumatera Utara 22156</li>
            </ul>
            <div className="flex space-x-4 mt-auto">
              <a href="https://www.facebook.com/share/1BFFDuW71Q/" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/ronsguesthouse_?igsh=a3JqbzZrNjVkbjlj" className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                <Instagram size={18} />
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
