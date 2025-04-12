// src/components/login/RoleCard.tsx
import React from 'react';
import styles from './RoleCard.module.css';

interface RoleCardProps {
  icon: React.ReactElement; // Expect a JSX element like <FaIcon />
  roleType: string; // e.g., "ADMIN", "AREA ADMIN"
  title: string; // e.g., "I am an Admin"
  description: string;
  features: string[];
  buttonText: string;
  colorScheme: 'admin' | 'areaAdmin'; // To apply different styles
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon,
  roleType,
  title,
  description,
  features,
  buttonText,
  colorScheme,
  onClick,
}) => {
  return (
    <div className={`${styles.card} ${styles[colorScheme]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <span className={styles.roleTypeBadge}>{roleType}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.features}>
        <p className={styles.featuresTitle}></p>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      <button className={styles.continueButton} onClick={onClick}>
        {buttonText} &rarr;
      </button>
    </div>
  );
};

export default RoleCard;