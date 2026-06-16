"use client";

import Image from "next/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

const slides = [
    {
        title: "Apoie uma solucão penedense",
        description: "Fortaleça nosso desenvolvimento usando nossa tecnologia.",
        image: "/logovambora-dark.svg",
    },
    {
        title: "Vambora levar Penedo mais longe",
        description: "Conecte pessoas, rotas e oportunidades com uma plataforma local.",
        image: "/logovambora-dark.svg",
    },
    {
        title: "Inovação feita por quem é daqui",
        description: "Cada apoio ajuda a evoluir funcionalidades para a nossa cidade.",
        image: "/logovambora-dark.svg",
    },
];

export default function MobileHeroCarousel() {
    return (
        <section className="w-full">
            <Splide
                options={{
                    type: "loop",
                    perPage: 1,
                    perMove: 1,
                    gap: "0.75rem",
                    arrows: false,
                    pagination: true,
                    autoplay: true,
                    interval: 8500,
                    pauseOnHover: true,
                    pauseOnFocus: true,
                }}
                aria-label="Carrossel de destaques do Vambora"
                className="w-full"
            >
                {slides.map((slide) => (
                    <SplideSlide key={slide.title}>
                        <article className="flex items-center gap-4 rounded-xl border border-gray-300 bg-gray-100 p-6">
                            <div className="flex flex-1 flex-col items-start gap-2">
                                <h2 className="text-lg font-semibold leading-tight text-gray-700">{slide.title}</h2>
                                <p className="text-sm leading-tight text-gray-500">{slide.description}</p>
                            </div>

                            <Image
                                src={slide.image}
                                alt={slide.title}
                                width={80}
                                height={150}
                                className="rounded-lg object-cover"
                            />
                        </article>
                    </SplideSlide>
                ))}
            </Splide>
        </section>
    );
}