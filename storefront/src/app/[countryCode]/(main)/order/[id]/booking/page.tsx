import { retrieveOrder } from "@lib/data/orders"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import BookingTemplate from "@modules/order/templates/booking-template"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export const metadata: Metadata = {
  title: "Book your appointment",
  description: "Choose a time slot for your tire mounting",
}

export default async function BookingPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  // If home delivery — no booking needed, skip straight to confirmed
  const shippingOption = (order.shipping_methods?.[0] as any)?.shipping_option
  const typeCode = shippingOption?.type?.code as string | undefined
  if (!typeCode || typeCode === "home-delivery") {
    redirect(`/${params.countryCode}/order/${params.id}/confirmed`)
  }

  return (
    <BookingTemplate
      order={order}
      typeCode={typeCode!}
      countryCode={params.countryCode}
    />
  )
}
