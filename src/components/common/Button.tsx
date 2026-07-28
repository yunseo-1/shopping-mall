import { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

// 타입 정의 부분
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  children: ReactNode;
}

// 기본값 설정
function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...rest
  // 동적 클래스명
}: ButtonProps) {
  const buttonClass = `
    ${styles.button}
    ${styles[variant]}
    ${fullWidth ? styles.fullWidth : ''}
    ${className}
  `.trim();

  // 랜더링 부분
  return (
    <button className={buttonClass} {...rest}>
      {children}
    </button>
  );
}

export default Button;