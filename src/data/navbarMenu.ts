import { Home, Compass, User, Settings, DollarSign, Users, MessageCircle } from 'lucide-react';

const navbarMenuData = [
  { 
    id: 1,
    active: true,
    mainMenu: true,
    userMenu: false,
    name: 'Home',
    icon: Home,
    href: '/',
  },
/*   { 
    id: 2,
    active: true,
    mainMenu: true,
    userMenu: false,
    name: 'Feed',
    icon: TrendingUp,
    href: '/feed',
  }, */
  { 
    id: 3,
    active: true,
    mainMenu: true,
    userMenu: false,
    name: 'Explore',
    icon: Compass,
    href: '/explore',
  },
  { 
    id: 4,
    active: true,
    mainMenu: true,
    userMenu: false,
    name: 'Communities',
    icon: Users,
    href: '/communities',
  },
  { 
    id: 5,
    active: true,
    mainMenu: true,
    userMenu: false,
    name: 'Messages',
    icon: MessageCircle,
    href: '/messages',
  },
  { 
    id: 6,
    active: true,
    mainMenu: false,
    userMenu: true,
    name: 'Profile',
    icon: User,
    href: '/profile',
  },
  { 
    id: 7,
    active: true,
    mainMenu: false,
    userMenu: true,
    name: 'Earnings',
    icon: DollarSign,
    href: '/earnings',
  },
  { 
    id: 8,
    active: true,
    mainMenu: false,
    userMenu: true,
    name: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

export default navbarMenuData;