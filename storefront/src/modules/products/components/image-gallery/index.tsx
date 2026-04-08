import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const TIRE_FALLBACK = "/tire-placeholder.jpg"

const PLACEHOLDER_PATHS = [
  "/tire-placeholder.svg",
  "/tire-placeholder.jpg",
  "/static/tire-placeholder.jpg",
]

const normalizeImageUrl = (value?: string | null) => {
  if (!value?.trim()) {
    return undefined
  }

  if (PLACEHOLDER_PATHS.some((path) => value.endsWith(path))) {
    return TIRE_FALLBACK
  }

  try {
    const { pathname } = new URL(value)
    return PLACEHOLDER_PATHS.includes(pathname) ? TIRE_FALLBACK : value
  } catch {
    return value
  }
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const galleryImages =
    images
      ?.map((image) => ({
        ...image,
        url: normalizeImageUrl(image?.url) ?? TIRE_FALLBACK,
      }))
      .filter((image) => Boolean(image.url)) ?? []

  const displayImages = galleryImages.length
    ? galleryImages
    : [{ id: "tire-fallback", url: TIRE_FALLBACK }]

  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        {displayImages.map((image, index) => {
          return (
            <Container
              key={image.id}
              className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle"
              id={image.id}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index <= 2 ? true : false}
                  className="absolute inset-0 rounded-rounded"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </Container>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
