import React, { createContext, useContext, useState } from "react";

export type ReleaseFormState = {
  primaryArtist: string;
  trackTitle: string;
  releaseTitle: string;
  genre: string;
  language: string;
  explicit: boolean;
  releaseDate: string;
  audioPath: string;
  coverPath: string;
};

const defaultState: ReleaseFormState = {
  primaryArtist: "",
  trackTitle: "",
  releaseTitle: "",
  genre: "",
  language: "",
  explicit: false,
  releaseDate: "",
  audioPath: "",
  coverPath: ""
};

const ReleaseContext = createContext<{
  state: ReleaseFormState;
  setState: React.Dispatch<React.SetStateAction<ReleaseFormState>>;
} | null>(null);

export const ReleaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ReleaseFormState>(defaultState);
  return <ReleaseContext.Provider value={{ state, setState }}>{children}</ReleaseContext.Provider>;
};

export const useRelease = () => {
  const context = useContext(ReleaseContext);
  if (!context) {
    throw new Error("ReleaseContext not available");
  }
  return context;
};
