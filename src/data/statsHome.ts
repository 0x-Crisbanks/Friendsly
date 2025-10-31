import { DollarSign, Globe, TrendingUp, Users } from "lucide-react";

  const statsHomeData = [
    { 
      label: 'Active Creators', 
      value: '10K+', 
      icon: Users, 
      color: 'from-blue-400 to-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/10',
      description: 'Creators earning daily'
    },
    { 
      label: 'Total Transactions', 
      value: '1M+', 
      icon: TrendingUp, 
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'from-emerald-500/10 to-emerald-600/10',
      description: 'Successful payments'
    },
    { 
      label: 'Platform Revenue', 
      value: '$50M+', 
      icon: DollarSign, 
      color: 'from-amber-400 to-amber-600',
      bgColor: 'from-amber-500/10 to-amber-600/10',
      description: 'Creator earnings'
    },
    { 
      label: 'Global Users', 
      value: '500K+', 
      icon: Globe, 
      color: 'from-purple-400 to-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/10',
      description: 'Worldwide community'
    },
  ];

    export default statsHomeData;