import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import Logo from './Logo';

const WelcomeAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  useEffect(() => {
    // Check if we should show the animation
    const shouldShow = sessionStorage.getItem('showWelcomeAnimation');
    
    if (shouldShow === 'true' && user) {
      setIsVisible(true);
      setIsFadingOut(false); // Reset fade out state for subsequent logins
      
      // Remove the flag so it doesn't trigger on refresh
      sessionStorage.removeItem('showWelcomeAnimation');
      
      // Start fade out after 2.5 seconds
      const fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);
      
      // Completely remove the component after fade out completes
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3300);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [user, location.pathname]); // Depend on location to trigger after navigation

  if (!isVisible) return null;

  return (
    <div className={`welcome-splash-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}>
      <div className="welcome-splash-content">
        <div className="welcome-splash-icon">
          <Logo size={52} showWordmark={false} />
        </div>
        <h1 className="welcome-splash-title">
          Welcome back, <span className="welcome-splash-name">{user?.firstName || 'Friend'}</span>!
        </h1>
        <div className="welcome-splash-divider"></div>
        <p className="welcome-splash-tagline">Handcrafted with Love</p>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
