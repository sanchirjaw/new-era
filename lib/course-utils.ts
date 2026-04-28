// Course title mapping and utilities

export function getDisplayTitle(title: string): string {
  // Hardcode "medkue" as AI course
  if (title.toLowerCase().includes("medkue")) {
    return "AI хичээл"
  }
  
  return title
}

export function getDisplayCategory(title: string): string {
  // Hardcode "medkue" as AI course category
  if (title.toLowerCase().includes("medkue")) {
    return "Хиймэл оюун ухаан"
  }
  
  return "Хичээл"
}

export function getDisplayDescription(title: string, originalDescription: string): string {
  // Hardcode "medkue" description
  if (title.toLowerCase().includes("medkue")) {
    return "Хиймэл оюун ухааны үндсэн ойлголт, машин сурах алгоритм, мэдээлэл боловсруулах технологийн талаар суралцана."
  }
  
  return originalDescription
}
