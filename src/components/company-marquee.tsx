'use client';

import { motion } from 'framer-motion';

const companies = [
  { name: 'Accenture', domain: 'accenture.com', color: '#A100FF' },
  { name: 'IBM', domain: 'ibm.com', color: '#054ADA', logoUrl: '/logos/ibm.svg' },
  { name: 'Cisco', domain: 'cisco.com', color: '#00BCEB' },
  { name: 'Deloitte', domain: 'deloitte.com', color: '#86BC25' },
  { name: 'Google', domain: 'google.com', color: '#4285F4' },
  { name: 'Microsoft', domain: 'microsoft.com', color: '#00A4EF' },
  { name: 'Amazon', domain: 'amazon.com', color: '#FF9900' },
  { name: 'NVIDIA', domain: 'nvidia.com', color: '#76B900' },
  { name: 'Apple', domain: 'apple.com', color: '#A2AAAD' },
  { name: 'Meta', domain: 'meta.com', color: '#0082FB' },
  { name: 'Adobe', domain: 'adobe.com', color: '#FF0000' },
  { name: 'Oracle', domain: 'oracle.com', color: '#C74634' },
  { name: 'TCS', domain: 'tcs.com', color: '#E31837', logoUrl: '/logos/tcs.svg' },
  { name: 'Infosys', domain: 'infosys.com', color: '#007CC3' },
  { name: 'HCLTech', domain: 'hcltech.com', color: '#0064C8', logoUrl: '/logos/hcltech.svg' },
  { name: 'Wipro', domain: 'wipro.com', color: '#00A2E8' },
  { name: 'Tech Mahindra', domain: 'techmahindra.com', color: '#E4223A' },
  { name: 'LTIMindtree', domain: 'ltimindtree.com', color: '#0A73B6' },
  { name: 'Cognizant', domain: 'cognizant.com', color: '#000048' },
  { name: 'Capgemini', domain: 'capgemini.com', color: '#0070AD' },
];

export function CompanyMarquee() {
  return (
    <div className="w-full overflow-hidden flex flex-col items-center mt-12 mb-8 relative z-20">
      <div className="flex items-center gap-4 mb-8 w-full max-w-md mx-auto opacity-70">
        <div className="h-px bg-gradient-to-r from-transparent to-border/80 flex-1"></div>
        <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] text-center">
          Trusted by companies
        </p>
        <div className="h-px bg-gradient-to-l from-transparent to-border/80 flex-1"></div>
      </div>
      <div className="w-full max-w-[1200px] mx-auto overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 240,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex whitespace-nowrap items-center w-fit"
        >
          {/* Double the array for seamless infinite scrolling */}
          {[...companies, ...companies].map((company, i) => (
            <div
              key={i}
              className="flex items-center gap-3 mx-12 transition-all duration-300 opacity-80 hover:opacity-100 hover:scale-105"
            >
              <img
                src={company.logoUrl || `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`}
                alt={company.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  // If all else fails, hide the image and just show the name
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-lg font-semibold tracking-tight dark:text-white text-black">
                {company.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
