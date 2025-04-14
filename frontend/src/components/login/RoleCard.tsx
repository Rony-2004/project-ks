// frontend/src/components/login/RoleCard.tsx (CLEAN CODE)
import React from 'react';
import styles from './RoleCard.module.css'; // Verify path & file existence

interface RoleCardProps {
  icon: React.ReactElement;
  roleType: string;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  colorScheme: 'admin' | 'areaAdmin';
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon, roleType, title, description, features, buttonText, colorScheme, onClick,
}) => {

  const handleButtonClick = () => {
      // Log that the button inside RoleCard was clicked
      console.log(`[RoleCard] Button "${buttonText}" clicked! Calling onClick prop function.`);
      // Call the function that was passed in via the onClick prop
      onClick();
  };

  return (
    <div className={`${styles.card} ${styles[colorScheme]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <span className={styles.roleTypeBadge}>{roleType}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.features}>
        <p className={styles.featuresTitle}>Features:</p>
        <ul>
          {features.map((feature, index) => ( <li key={index}>{feature}</li> ))}
        </ul>
      </div>
      {/* Ensure this button calls the internal handleButtonClick */}
      <button className={styles.continueButton} onClick={handleButtonClick}>
        {buttonText} &rarr;
      </button>
    </div>
  );
};

export default RoleCard;