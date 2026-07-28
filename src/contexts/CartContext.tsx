// 장바구니
/*
- 장바구니 아이템 관리
- 상품 추가 / 삭제
- 수량 변경
- 총액 계산
*/

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number, selectionOptions?: { [key: string]: string }) => void
    removeFromCart: (id: number) => void
    updateQuantity: (id: number, quantity: number) => void
    clearCart: () => void
    totalPrice: number
    totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
    children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
    // localStorage에서 장바구니 불러오기
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart')
        return saved ? JSON.parse(saved) : []
    })

    // items가 변경될 때마다 localStorage에 저장
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    // 장바구니에 추가
    const addToCart = (
        product: Product,
        quantity: number,
        selectedOptions?: { [key: string]: string }
    ) => {
        setItems(prevItems => {
            // 이미 같은 상품이 있는지 확인
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

    // 장바구니에서 삭제
    const removeFromCart = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id))
    }

    // 수량 변경
    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
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

    // 총 금액 계산
    const totalPrice = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity, 0
    )

    // 총 아이템 수
    const totalItems = items.reduce(
        (sum, item) => sum + item.quantity, 0
    )

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

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart는 CartProvider 안에서만 사용할 수 있습니다.')
    }
    return context
}