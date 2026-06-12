plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "online.white_noise.nfc"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    flavorDimensions.add("abi")
    productFlavors {
        create("universal") {
            dimension = "abi"
        }
        create("arm64") {
            dimension = "abi"
        }
        create("arm") {
            dimension = "abi"
        }
        create("x86") {
            dimension = "abi"
        }
        create("x86_64") {
            dimension = "abi"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation(project(":tauri-android"))
}
