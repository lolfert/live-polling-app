export interface Option {
        id: string;
        text: string;
        _count?: {
                votes: number;
        };
}

export interface Poll {
        id: string;
        question: string;
        options: Option[];
}