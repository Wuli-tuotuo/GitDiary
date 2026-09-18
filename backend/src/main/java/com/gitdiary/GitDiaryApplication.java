package com.gitdiary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GitDiaryApplication {

    public static void main(String[] args) {
        SpringApplication.run(GitDiaryApplication.class, args);
        System.out.println("\n" +
                "  ____ _ _   ____  _                \n" +
                " / ___(_) |_|  _ \\(_) __ _ _ __ _   _ \n" +
                "| |  _| | __| | | | |/ _` | '__| | | |\n" +
                "| |_| | | |_| |_| | | (_| | |  | |_| |\n" +
                " \\____|_|\\__|____/|_|\\__,_|_|   \\__, |\n" +
                "                                  |___/ \n" +
                "\nGitDiary Backend started successfully!\n" +
                "Swagger UI: http://localhost:8080/api/swagger-ui.html\n" +
                "H2 Console: http://localhost:8080/api/h2-console\n");
    }
}
