const GridTexture = ({ opacity = 0.04 }: { opacity?: number }) => (
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage:
        "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      opacity,
    }}
  />
);

const PlusTexture = ({ opacity = 0.025 }: { opacity?: number }) => (
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 0h2v40h-2zM0 19h40v2H0z' fill='rgba(255%2C255%2C255%2C1)'/%3E%3C/svg%3E")`,
      opacity,
    }}
  />
);

interface GoldRadialGlowProps {
  from?: "top" | "center" | "bottom";
  intensity?: number;
}

const GoldRadialGlow = ({ from = "top", intensity = 0.07 }: GoldRadialGlowProps) => {
  const pos = from === "top" ? "50% 0%" : from === "bottom" ? "50% 100%" : "50% 50%";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 900px 600px at ${pos}, rgba(245,196,0,${intensity}) 0%, transparent 70%)`,
      }}
    />
  );
};

export { GridTexture, PlusTexture, GoldRadialGlow };
