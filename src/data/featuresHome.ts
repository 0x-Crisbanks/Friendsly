import { DollarSign, Lock, Shield, Users } from "lucide-react";

const featuresHomeData = [
    {
      icon: Shield,
      title: 'Decentralized & Secure',
      description: 'Built on blockchain technology ensuring complete privacy and security for all interactions.',
      color: 'from-blue-500 to-cyan-500',
      delay: 0.1,
    },
    {
      icon: DollarSign,
      title: 'Crypto Payments',
      description: 'Direct crypto payments to creators without intermediaries. Lower fees, instant transactions.',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2,
    },
    {
      icon: Lock,
      title: 'Content Ownership',
      description: 'Creators maintain full ownership of their content through decentralized storage (IPFS).',
      color: 'from-purple-500 to-pink-500',
      delay: 0.3,
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'DAO governance allows the community to shape the future of the platform.',
      color: 'from-orange-500 to-red-500',
      delay: 0.4,
    },
  ];

  export default featuresHomeData;