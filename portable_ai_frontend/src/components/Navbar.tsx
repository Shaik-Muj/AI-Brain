import React from 'react';

interface NavbarProps {
  // Add any props you need here
  onNavigate?: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  // Simple navigation without react-router-dom
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Fallback to simple href navigation
      window.location.href = page;
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex items-center">
      <a 
        href="#"
        onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}
        className="text-lg font-semibold cursor-pointer"
      >
        Home
      </a>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); handleNavigation('/pdf-chat'); }}
        className="ml-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
      >
        PDF Chat
      </a>
    </nav>
  );
};

export default Navbar;