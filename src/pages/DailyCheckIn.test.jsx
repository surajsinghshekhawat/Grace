import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../contexts/LanguageContext.jsx";
import DailyCheckIn from "./DailyCheckIn.jsx";

function renderCheckIn(path = "/elder/checkin") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <DailyCheckIn />
      </MemoryRouter>
    </LanguageProvider>
  );
}

describe("DailyCheckIn", () => {
  it("shows the first check-in question in English", () => {
    renderCheckIn();
    expect(screen.getByText(/how is your mood today/i)).toBeInTheDocument();
  });
});
