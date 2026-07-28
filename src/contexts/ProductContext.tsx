// 상품 데이터
/*
- 전체 상품 데이터 관리
- 상품 조회
- 베스트 상품 조회
- 신상품 조회
- 카테고리별 조회
- 필터링 및 정렬
*/
import { createContext, useState, useContext } from 'react';
import type { Product, Category, FilterState } from '../types';
import type { ReactNode } from 'react'
import { PRODUCTS } from '../data/products';


// Context에서 제공할 데이터와 함수들의 타입 정의
interface ProductContextType {
    products: Product[]; // 전체 상품 목록
    getProduct: (id: number) => Product | undefined; // 특정 상품 조회
    getBestProducts: () => Product[];
    getNewProducts: () => Product[];
    getProductsByCategory: (category: Category | "all") => Product[];
    filterProducts: (filter: FilterState) => Product[]; // 조건에 따른 필터링 / 정렬
}

// Context 생성
const ProductContext = createContext<ProductContextType | undefined>(undefined)
// ProductContextType: Context가 제공할 데이터 타입
// | undefined : 초기값이 없을 수 있음
// undefined: 초기값

interface ProductProviderProps {
    children: ReactNode
}

// 실제 값은 여기서 제공 (children은 Provider가 감쌀 하위 컴포넌트들)
export function ProductProvider({ children }: ProductProviderProps) {
    // 상품 목록 상태. 현재는 PRODUCTS 상수를 그대로 사용 -> 추후 API 연동 시 setProducts로 변경 가능
    const [products] = useState<Product[]>(PRODUCTS)

    // 상품 ID로 특정 상품 조회 (찾으면 Product 반환, 없으면 undefined 반환)
    const getProduct = (id: number): Product | undefined => {
        return products.find(product => product.id === id)
    }

    const getBestProducts = (): Product[] => {
        return products.filter(product => product.isBest)
    }

    const getNewProducts = (): Product[] => {
        return products.filter(product => product.isNew)
    }

    const getProductsByCategory = (category: Category | "all"): Product[] => {
        if (category === "all") return products;
        return products.filter(product => product.category === category)
    }

    // 상품 필터링 + 정렬
    /*
    처리 순서
    1. 카테고리 필터
    2. 가격 범위 필터
    3. 정렬
    */
    const filterProducts = (filter: FilterState): Product[] => {
        // 원본 상품 배열 복사 (이후 조건에 따라 filtered 변경)
        let filtered = products

        // 카테고리 필터 (all이 아니면 해당 카테고리만 남김)
        if (filter.category !== "all") {
            filtered = filtered.filter(p => p.category === filter.category)
        }

        filtered = filtered.filter(
            p =>
                p.price >= filter.minPrice && p.price <= filter.maxPrice
        )

        /* 
        정렬 
        price-low : 가격 낮은 순 
        price-high : 가격 높은 순 
        popular : 평점 높은 순 
        newest : 최신 상품 순 
        */
        switch (filter.sortBy) {
            case "price-low":
                filtered = [...filtered].sort((a, b) => a.price - b.price) // 오름차순
                break
            case "price-high":
                filtered = [...filtered].sort((a, b) => b.price - a.price) // 내림차순
                break
            case "popular":
                filtered = [...filtered].sort((a, b) => b.rating - a.rating) // 평점 높은 순
                break
            case "newest":
                filtered = [...filtered].sort((a, b) => b.id - a.id) // 최신 상품 순 (id가 클수록 최근 상품이라고 가정)
                break
        }
        return filtered
    }

    // Context를 통해 제공할 값들
    const value: ProductContextType = {
        products,
        getProduct,
        getBestProducts,
        getNewProducts,
        getProductsByCategory,
        filterProducts
    }

    // 하위 컴포넌트들이 useProducts()로 접근 가능
    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    )
}

export function useProducts() {
    const context = useContext(ProductContext)
    if (context === undefined)
        throw new Error('useProducts는 ProductProvider 안에서만 사용할 수 있습니다.')

    return context
}