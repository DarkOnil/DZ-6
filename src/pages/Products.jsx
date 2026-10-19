import { useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getProducts, patchProduct } from "../api/products"
import { useSearchParams } from "react-router-dom"

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryClient = useQueryClient()
    const [editingId, setEditingId] = useState(null)
    const [title, setTitle] = useState("")
    const [price, setPrice] = useState("")
    const [rating, setRating] = useState("")

    const filters = {
        q: searchParams.get('q') ?? '',
        category: searchParams.get('category') ?? '',
        sort: searchParams.get('sort') ?? 'price',
        order: searchParams.get('order') ?? 'asc'
    }

    const updateFilters = (key, value) => {
        const next = new URLSearchParams(searchParams)
        value ? next.set(key, value) : next.delete(key)
        setSearchParams(next)
    }

    const { data = [], isLoading, isFetching, error } = useQuery({
        queryKey: ['products', filters], // параметры - часть ключа
        queryFn: () => getProducts(filters),
        placeholderData: keepPreviousData // не мигать пустым экраном
    })

    const editMutation = useMutation({
        mutationFn: patchProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setEditingId(null)
        }
    })

    const editProduct = (product) => {
        setEditingId(product.id)
        setTitle(product.title)
        setPrice(String(product.price))
        setRating(String(product.rating))
    }

    const saveProduct = (e) => {
        e.preventDefault()
        editMutation.mutate({
            id: editingId,
            title,
            price: Number(price),
            rating: Number(rating)
        })
    }

    if (isLoading) return <p>Загрузка...</p>
    if (error) return <p>Ошибка: {error.message}</p>

    return (
        <div>
            <h1>Каталог товаров</h1>
            <input
                value={filters.q}
                onChange={(e) => updateFilters('q', e.target.value)}
                placeholder="Поиск"
            />

            <select value={filters.category} onChange={(e) => updateFilters('category', e.target.value)}>
                <option value=''>Все</option>
                <option value='phones'>Телефоны</option>
                <option value='laptops'>Ноутбуки</option>
                <option value='audio'>Аудио</option>
            </select>

            <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                    const [sort, order] = e.target.value.split('-')
                    const next = new URLSearchParams(searchParams)
                    next.set('sort', sort)
                    next.set('order', order)
                    setSearchParams(next)
                }}
            >
                <option value='price-asc'>Сначала дешёвые</option>
                <option value='price-desc'>Сначала дорогие</option>
                <option value='rating-desc'>По рейтингу</option>
                <option value='title-asc'>По названию</option>
            </select>

            {isFetching && <small> Обновляем...</small>}

            <ul>
                {data.map((p) => (
                    <li key={p.id}>
                        {editingId === p.id ? (
                            <form onSubmit={saveProduct}>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название" required />
                                <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" required />
                                <input value={rating} onChange={(e) => setRating(e.target.value)} type="number" min="0" max="5" step="0.1" required />
                                <button disabled={editMutation.isPending}>Сохранить</button>
                                <button type="button" onClick={() => setEditingId(null)}>Отмена</button>
                            </form>
                        ) : (
                            <>
                                {p.title} - {p.price} (рейтинг: {p.rating}){' '}
                                <button onClick={() => editProduct(p)}>Изменить</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            {data.length === 0 && <p>Товары не найдены</p>}
            {editMutation.isError && <p>Ошибка изменения: {editMutation.error.message}</p>}
        </div>
    )
}
