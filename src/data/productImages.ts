import type { Category } from '../types/store';

import heroPrimeSetup from '../assets/images/hero_prime_setup_1795603363418.jpg';
import desktopPcImg from '../assets/images/prod_desktop_pc_1795603364089.jpg';
import proLaptopImg from '../assets/images/prod_pro_laptop_1795603363552.jpg';
import flagshipPhoneImg from '../assets/images/prod_flagship_phone_1795603364951.jpg';
import proTabletImg from '../assets/images/prod_pro_tablet_1795603365334.jpg';
import usbAccessoriesImg from '../assets/images/prod_usb_accessories_1795603366412.jpg';
import mechKeyboardImg from '../assets/images/prod_mech_keyboard_1795603365482.jpg';
import wirelessMouseImg from '../assets/images/prod_wireless_mouse_1795603366359.jpg';
import studioMonitorImg from '../assets/images/prod_studio_monitor_1795603366586.jpg';
import laserPrinterImg from '../assets/images/prod_laser_printer_1795603367157.jpg';
import gamingGearImg from '../assets/images/prod_gaming_gear_1795603366962.jpg';
import smartWatchImg from '../assets/images/prod_smart_watch_1795603367344.jpg';
import studioHeadphonesImg from '../assets/images/prod_studio_headphones_1795603367814.jpg';
import pcComponentsImg from '../assets/images/prod_pc_components_1795603388826.jpg';

export const HERO_IMAGE = heroPrimeSetup;

export const IMAGE_PRESETS: Array<{ key: string; label: string; src: string }> = [
  { key: 'preset:Computers', label: 'Workstation Tower', src: desktopPcImg },
  { key: 'preset:Laptops', label: 'Aluminum Laptop', src: proLaptopImg },
  { key: 'preset:Mobile Phones', label: 'Titanium Smartphone', src: flagshipPhoneImg },
  { key: 'preset:Tablets', label: 'Pro Slate Tablet', src: proTabletImg },
  { key: 'preset:Accessories', label: 'Thunderbolt Dock & Charger', src: usbAccessoriesImg },
  { key: 'preset:Keyboards', label: 'Mechanical Keyboard', src: mechKeyboardImg },
  { key: 'preset:Mouse', label: 'Ergonomic Wireless Mouse', src: wirelessMouseImg },
  { key: 'preset:Monitors', label: '4K Studio Monitor', src: studioMonitorImg },
  { key: 'preset:Printers', label: 'Wireless Laser Printer', src: laserPrinterImg },
  { key: 'preset:Gaming Products', label: 'Pro Gaming Controller & Mouse', src: gamingGearImg },
  { key: 'preset:Smart Watches', label: 'Titanium Smart Watch', src: smartWatchImg },
  { key: 'preset:Headphones', label: 'ANC Studio Headphones', src: studioHeadphonesImg },
  { key: 'preset:Computer Components', label: 'RTX GPU & NVMe SSD', src: pcComponentsImg },
];

export const CATEGORY_IMAGES: Record<string, string> = {
  Computers: desktopPcImg,
  Laptops: proLaptopImg,
  'Mobile Phones': flagshipPhoneImg,
  Tablets: proTabletImg,
  Accessories: usbAccessoriesImg,
  Keyboards: mechKeyboardImg,
  Mouse: wirelessMouseImg,
  Monitors: studioMonitorImg,
  Printers: laserPrinterImg,
  'Gaming Products': gamingGearImg,
  'Smart Watches': smartWatchImg,
  Headphones: studioHeadphonesImg,
  'Computer Components': pcComponentsImg,
};

export function resolveProductImageSrc(
  category: Category,
  imageUrl?: string
): string | undefined {
  if (imageUrl) {
    if (imageUrl.startsWith('preset:')) {
      const catKey = imageUrl.slice('preset:'.length);
      return CATEGORY_IMAGES[catKey];
    }
    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }
  }
  return CATEGORY_IMAGES[category];
}

export function formatPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}
