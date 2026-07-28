import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// 테마는 'light' 또는 'dark' 둘 중 하나만 가능하도록 유니온 타입으로 제한
type Theme = "light" | "dark";

// Context가 실제로 담고 있을 값의 타입(모양) 정의
interface ThemeContextType {
    theme: Theme;              // 현재 테마 값
    toggleTheme: () => void;   // 테마를 전환하는 함수
}

// createContext<타입 | undefined>(초기값)
// 초기값을 undefined로 준 이유: Provider로 감싸지 않은 곳에서 실수로 이 Context를 쓰면
// undefined임을 감지해서 명시적으로 에러를 던질 수 있게 하기 위함 (아래 useTheme 참고)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider가 받는 props 타입
interface ThemeProviderProps {
    children: ReactNode; // ReactNode: JSX, 문자열, 숫자, 배열 등 렌더링 가능한 모든 것을 포괄하는 타입
}

// 이 컴포넌트로 감싼 하위 트리 전체에 테마 값을 공급(provide)하는 역할
export function ThemeProvider({ children }: ThemeProviderProps) {
    // useState<Theme>(초기화 함수)
    // 초기화 함수를 넘기면 컴포넌트가 처음 마운트될 때 딱 1번만 실행됨 (매 렌더링마다 실행 안 됨 → 성능상 이점)
    const [theme, setTheme] = useState<Theme>(() => {
        // localStorage에 저장된 이전 테마 값이 있는지 확인
        const saved = localStorage.getItem('theme');
        // 저장된 값이 있으면 그 값을(Theme 타입으로 단언), 없으면 기본값 'light' 사용
        return (saved as Theme) || 'light';
    });

    // theme 값이 바뀔 때마다 실행되는 부수 효과
    useEffect(() => {
        // 현재 테마를 localStorage에 저장 → 새로고침해도 마지막 테마가 유지됨
        localStorage.setItem('theme', theme);
        // body에 클래스 추가/제거
        // 예: document.body.className이 'dark'가 되면, CSS에서 body.dark { ... } 같은 스타일을 적용 가능
        document.body.className = theme;
    }, [theme]); // 의존성 배열에 theme을 넣어서, theme이 바뀔 때마다만 실행

    // 테마를 전환하는 함수
    const toggleTheme = () => {
        // 함수형 업데이트(prev => ...) : 이전 state 값을 기준으로 안전하게 다음 값을 계산
        // 삼항 연산자로 light면 dark로, 아니면(dark면) light로 전환
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Provider에 실제로 전달할 값 객체
    // ThemeContextType과 정확히 같은 모양(shape)이어야 함
    const value: ThemeContextType = {
        theme,
        toggleTheme
    };

    return (
        // value로 넘긴 객체를 하위의 모든 자식 컴포넌트가 useContext(ThemeContext)로 꺼내 쓸 수 있게 됨
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// 이 Context를 편하게 꺼내 쓰기 위한 커스텀 훅
export function useTheme() {
    // useContext: 가장 가까운 상위 Provider가 제공한 value를 읽어옴
    const context = useContext(ThemeContext);

    // Provider로 감싸지 않은 컴포넌트에서 이 훅을 호출하면 context가 undefined임
    // (createContext의 초기값을 undefined로 설정해뒀기 때문에 감지 가능)
    if (context === undefined) {
        // 개발자가 실수로 ThemeProvider 바깥에서 useTheme()을 호출했을 때
        // 원인을 바로 알 수 있도록 명확한 에러 메시지를 던짐
        throw new Error('useTheme는 ThemeProvider 안에서만 사용할 수 있습니다.');
    }

    // 정상적인 경우 context(실제 값)를 반환
    return context;
}