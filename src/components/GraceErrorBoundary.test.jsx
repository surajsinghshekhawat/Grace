import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { GraceErrorBoundary } from "./GraceErrorBoundary.jsx";

function Thrower() {
  throw new Error("boom");
}

describe("GraceErrorBoundary", () => {
  it("shows fallback UI when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <BrowserRouter>
        <GraceErrorBoundary section="test" homeTo="/">
          <Thrower />
        </GraceErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByRole("heading", { name: /something didn't load right/i })).toBeTruthy();
    spy.mockRestore();
  });
});
