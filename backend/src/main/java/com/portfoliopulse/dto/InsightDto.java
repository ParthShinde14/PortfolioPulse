package com.portfoliopulse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightDto {
    private String type;       // WARNING / INFO / SUCCESS / TIP
    private String category;   // Concentration / Diversification / Performance / Sector / Risk
    private String title;
    private String message;
}
