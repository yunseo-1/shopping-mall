// 장바구니
/*
- 장바구니 상태를 전역으로 관리
- 상품 추가 / 삭제
- 수량 변경
- 총 금액 계산
- localStorage에 저장하여 새로고침 후에도 유지
*/

import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react'
import type { CartItem, Product } from '../types';

// Context를 통해 제공할 데이터와 함수들의 타입 정의
interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number, selectionOptions?: { [key: string]: string }) => void
    removeFromCart: (id: number) => void
    updateQuantity: (id: number, quantity: number) => void
    clearCart: () => void
    totalPrice: number
    totalItems: number
}

// Context 생성 (초기값 undefined) -> 실제 값은 CartProvider에서 공급함
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider가 감쌀 자식 컴포넌트 타입
interface CartProviderProps {
    children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
    // localStorage에 저장된 장바구니 불러오기
    const [items, setItems] = useState<CartItem[]>(() => { // useState의 초기값을 함수로 전달하면 최초 렌더링 시 1번만 실행됨
        const saved = localStorage.getItem('cart')
        return saved ? JSON.parse(saved) : [] // 저장된 값이 있으면 파싱, 없이면 빈 배열 반환
    })

    // items가 변경될 때마다 localStorage 갱신 (새로고침해도 장바구니 유지됨)
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    // 장바구니에 추가 (같은 상품 + 같은 옵션이면 새 항목을 만들지 않고 수량만 증가. 다른 옵션이면 별도 상품으로 취급)
    const addToCart = (
        product: Product,
        quantity: number,
        selectedOptions?: { [key: string]: string }
    ) => {
        setItems(prevItems => {
            // 이미 같은 상품이 있는지 확인 (상품 id & 선택 옵션이 같으면 같은 상품으로 판단)
            const existingItem = prevItems.find(
                item => item.product.id === product.id &&
                    JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
            )

            if (existingItem) {
                // 있으면 수량만 증가
                return prevItems.map(item =>
                    item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item
                )
            } else {
                // 없으면 새로 추가
                const newItem: CartItem = {
                    id: Date.now(),
                    product,
                    quantity,
                    selectedOptions
                }

                return [...prevItems, newItem]
            }
        })
    }

    // 장바구니에서 삭제 (전달받은 id를 제외한 항목만 남김)
    const removeFromCart = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id))
    }

    // 수량 변경
    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) { // 0 이하가 되면 자동 삭제
            removeFromCart(id)
            return
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        )
    }

    // 장바구니 비우기
    const clearCart = () => {
        setItems([])
    }

    // 총 금액 계산 (상품 가격 * 수량 전부 더함)
    const totalPrice = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity, 0
    )

    // 총 아이템 수 (각 상품의 quantity 전부 더함)
    const totalItems = items.reduce(
        (sum, item) => sum + item.quantity, 0
    )

    // Context로 제공할 값 묶기
    const value: CartContextType = {
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}

// 하위 컴포넌트들이 useCart()를 통해 value 사용 가능
export function useCart() {
    const context = useContext(CartContext)
    // Provider 밖에서 사용 시 에러 발생
    if (context === undefined) {
        throw new Error('useCart는 CartProvider 안에서만 사용할 수 있습니다.')
    }
    return context
}