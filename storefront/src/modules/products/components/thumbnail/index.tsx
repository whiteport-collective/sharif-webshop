import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = getImageSource(thumbnail, images)

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-ui-bg-subtle shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const TIRE_PLACEHOLDER = "/tire-placeholder.svg"

const PLACEHOLDER_PATHS = ["/tire-placeholder.svg", "/tire-placeholder.jpg", "/static/tire-placeholder.jpg"]

const isNonEmptyString = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0

const isKnownPlaceholderUrl = (value: string) => {
  if (PLACEHOLDER_PATHS.some((path) => value.endsWith(path))) {
    return true
  }

  try {
    const { pathname } = new URL(value)
    return PLACEHOLDER_PATHS.includes(pathname)
  } catch {
    return false
  }
}

const normalizeImageUrl = (value?: string | null) => {
  if (!isNonEmptyString(value)) {
    return undefined
  }

  return isKnownPlaceholderUrl(value) ? TIRE_PLACEHOLDER : value
}

const getImageSource = (
  thumbnail?: string | null,
  images?: ThumbnailProps["images"]
) => {
  const thumbnailSource = normalizeImageUrl(thumbnail)

  if (thumbnailSource) {
    return thumbnailSource
  }

  for (const image of images ?? []) {
    const imageSource = normalizeImageUrl(image?.url)

    if (imageSource) {
      return imageSource
    }
  }

  return TIRE_PLACEHOLDER
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  return (
    <Image
      src={image || TIRE_PLACEHOLDER}
      alt="Thumbnail"
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={50}
      loading="lazy"
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
    />
  )
}

export default Thumbnail
