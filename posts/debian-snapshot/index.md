---
title: "使用 Debian Snapshot 软件源回到过去"
createDate: "2024-06-03"
tags: ["Linux", "Debian"]
---

[Debian Snapshot](https://snapshot.debian.org/) 是 Debian 官方提供的时间机器，保留着 Debian 官方软件源的历史。最早的快照可以追溯到 [2005 年](https://snapshot.debian.org/archive/debian/)，每天至少快照一次。

把它设置为 apt 源就能搭建过去的环境，非常适合做考古研究或者跑老软件。

## TL;DR

- 运行一个比快照的时间老的 debian 虚拟机 / docker 容器 / chroot / 随便什么别的东西
- 在 sources.list 的 URL 前面加上 `[check-valid-until=no]`
- 把 sources.list 的 URL 都改成 `http://snapshot.debian.org/archive/debian/${时间戳}`，时间戳格式为 yyyymmddThhmmssZ 或 yyyymmdd
- `apt update && apt upgrade`

`sources.list` 示例：

```plaintext
deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20191224T000000Z buster main
deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20191224T000000Z buster/updates main
deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20191224T000000Z buster-updates main
```

（上面的配置不适合特别特别古老的情况，请参考下文“使用 snapshot 源”）

## 基础知识

先来熟悉一下 `sources.list` 的语法。~~当然跳过也没关系~~

本节以下内容节选、参考了[官方 wiki](https://wiki.debian.org/SourcesList)。

`sources.list` 文件的每一条记录符合以下格式：

<!-- > The entries in this file normally follow this format: -->

```
deb http://site.example.com/debian distribution component1 component2 component3
deb-src http://site.example.com/debian distribution component1 component2 component3
```

### 包的类型

每一行的第一个词（`deb` 或 `deb-src`）指定包的类型。[deb](https://wiki.debian.org/deb) 表示事先编译好的二进制包，我们平时用的就是这个。`deb-src` 表示[源码包](https://wiki.debian.org/SourcePackage)，包含未经修改的[源码](https://wiki.debian.org/source)、Debian 控制文件（[.dsc](https://wiki.debian.org/dsc)）和 `diff.gz`（这个软件在 debian 上所需的补丁）。

<!-- > The first word on each line, deb or deb-src, indicates the type of archive. Deb indicates that the archive contains binary packages ([deb](https://wiki.debian.org/deb)), the pre-compiled packages that we normally use. Deb-src indicates [source packages](https://wiki.debian.org/SourcePackage), which are the original program [sources](https://wiki.debian.org/source) plus the Debian control file ([.dsc](https://wiki.debian.org/dsc)) and the diff.gz containing the changes needed for packaging the program. -->

### 仓库 URL

第二列是[仓库](https://wiki.debian.org/DebianRepository)的 URL，软件包就是从这个 URL 下载的。[Debian 仓库的镜像列表](https://www.debian.org/mirror/list)

<!-- > The next entry on the line is a URL to the [repository](https://wiki.debian.org/DebianRepository) that you want to download the packages from. The main list of Debian repository mirrors is located [here](https://www.debian.org/mirror/list). -->

### 发行版（distribution）

发行版字段可以填发行代号（[stretch](https://wiki.debian.org/DebianStretch)，[buster](https://wiki.debian.org/DebianBuster)，[bullseye](https://wiki.debian.org/DebianBullseye)，[bookworm](https://wiki.debian.org/DebianBookworm)，[sid](https://wiki.debian.org/DebianSid)）或发行类（[oldoldstable](https://wiki.debian.org/DebianOldOldStable)，[oldstable](https://wiki.debian.org/DebianOldStable)，[stable](https://wiki.debian.org/DebianStable)，[testing](https://wiki.debian.org/DebianTesting)，[unstable](https://wiki.debian.org/DebianUnstable)）。想保持跟进某个发行类就填发行类，想保持跟进某个大版本就填发行代号。最好避免使用发行类，否则容易在没有准备的情况下突然面临大版本更新，容易把系统搞坏。更新大版本应当是个谨慎、小心的过程，并且两年改一次配置文件也不是麻烦事。

例如，如果你想帮助测试 testing 版本，可以填 testing。如果你想一直用 trixie，从 testing 用到停止支持，就填 trixie。

<!-- > The 'distribution' can be either the release code name / alias ([stretch](https://wiki.debian.org/DebianStretch), [buster](https://wiki.debian.org/DebianBuster), [bullseye](https://wiki.debian.org/DebianBullseye), [bookworm](https://wiki.debian.org/DebianBookworm), [sid](https://wiki.debian.org/DebianSid)) or the release class ([oldoldstable](https://wiki.debian.org/DebianOldOldStable), [oldstable](https://wiki.debian.org/DebianOldStable), [stable](https://wiki.debian.org/DebianStable), [testing](https://wiki.debian.org/DebianTesting), [unstable](https://wiki.debian.org/DebianUnstable)) respectively. If you mean to be tracking a release class then use the class name, if you want to track a Debian point release, use the code name. Avoid using [stable](https://wiki.debian.org/DebianStable) in your sources.list as that results in nasty surprises and broken systems when the next release is made; upgrading to a new release should be a deliberate, careful action and editing a file once every two years is not a burden.
>
> For example, if you always want to help test the testing release, use 'testing'. If you are tracking trixie and want to stay with it from testing to end of life, use 'trixie'. -->

### 组件（component）

[`main`](https://www.debian.org/doc/debian-policy/ch-archive#s-main) 由符合 Debian 自由软件指导方针（[DFSG](https://www.debian.org/social_contract#guidelines)）的包构成，并且这些包不依赖 main 以外的包。Debian 发行版只由这些包组成。

[`contrib`](https://www.debian.org/doc/debian-policy/ch-archive#s-contrib) 的包同样符合 DFSG，但是依赖不在 main 里的包（可能在 non-free 里）。

[`non-free`](https://www.debian.org/doc/debian-policy/ch-archive#s-non-free) 包含不符合 DFSG 的软件。

<!-- > [`main`](https://www.debian.org/doc/debian-policy/ch-archive#s-main) consists of [DFSG](https://www.debian.org/social_contract#guidelines)-compliant packages, which do not rely on software outside this area to operate. These are the only packages considered part of the Debian distribution.
>
> [`contrib`](https://www.debian.org/doc/debian-policy/ch-archive#s-contrib) packages contain DFSG-compliant software, but have dependencies not in main (possibly packaged for Debian in non-free).
>
> [`non-free`](https://www.debian.org/doc/debian-policy/ch-archive#s-non-free) contains software that does not comply with the DFSG. -->

此外，Debian 近两年新增了 `non-free-firmware` 组件，可以让 bookworm 及以后的版本更方便地安装一些非自由的固件。

### 官方 sources.list 示例

Debian 12/Bookworm (stable)（2023 年 6 月 10 日发布）

```plaintext
deb http://deb.debian.org/debian bookworm main non-free-firmware
deb-src http://deb.debian.org/debian bookworm main non-free-firmware

deb http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware
deb-src http://deb.debian.org/debian-security/ bookworm-security main non-free-firmware

deb http://deb.debian.org/debian bookworm-updates main non-free-firmware
deb-src http://deb.debian.org/debian bookworm-updates main non-free-firmware
```

需要 `contrib`、`non-free` 的话:

```plaintext
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware

deb http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware

deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
deb-src http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
```

更多示例请参考[原文](https://wiki.debian.org/SourcesList)。

## 使用 snapshot 源

本节内容节选、参考了[官网](https://snapshot.debian.org/)。

要使用过去某时刻的软件源，给你的 `sources.list` 添加如下代码：

<!-- > If you want to add a specific date's archive to your apt sources.list simply add an entry like these: -->

```plaintext
deb     https://snapshot.debian.org/archive/debian/20091004T111800Z/ lenny main
deb-src https://snapshot.debian.org/archive/debian/20091004T111800Z/ lenny main
deb     https://snapshot.debian.org/archive/debian-security/20091004T121501Z/ lenny/updates main
deb-src https://snapshot.debian.org/archive/debian-security/20091004T121501Z/ lenny/updates main
```

要使用 https 的话，需要有 `ca-certificates` 包（当然直接用 http 也可以）。

<!-- > To access snapshots using https, you need to install the ca-certificates package; with apt version earlier than 1.5~alpha1 you also need to install the apt-transport-https package. (Note that http:// also still works if you prefer.) -->

要了解请求的快照是否存在（日期是否合法），用浏览器查看即可。合法的日期格式是 `yyyymmddThhmmssZ` 或 `yyyymmdd`。如果请求的时间戳没有快照，会返回时间戳之前的最新的一个快照。

<!-- > To learn which snapshots exist, i.e. which date strings are valid, simply browse the list as mentioned above. Valid date formats are yyyymmddThhmmssZ or simply yyyymmdd. If there is no import at the exact time you specified you will get the latest available timestamp which is before the time you specified. -->

不新的快照会导致 apt 报 Release file expired 的错误，可以参考下面的例子添加 `[check-valid-until=no]` 来解决。

如果你的环境特别特别老，apt 版本小于 1.1.exp9 的话，可以用 `aptitude -o Acquire::Check-Valid-Until=false update` 或 `apt-get -o Acquire::Check-Valid-Until=false update` 解决。

<!-- > To access snapshots of suites using Valid-Until that are older than a dozen days, it is necessary to ignore the Valid-Until header within Release files, in order to prevent apt from disregarding snapshot entries ("Release file expired"). Use aptitude -o Acquire::Check-Valid-Until=false update or apt-get -o Acquire::Check-Valid-Until=false update for this purpose.
>
> If you use at least apt version 1.1.exp9 (stretch and later), you can use this instead: -->

```plaintext
deb [check-valid-until=no] https://snapshot.debian.org/archive/debian/20091004T111800Z/ lenny main
deb-src [check-valid-until=no] https://snapshot.debian.org/archive/debian/20091004T111800Z/ lenny main
deb [check-valid-until=no] https://snapshot.debian.org/archive/debian-security/20091004T121501Z/ lenny/updates main
deb-src [check-valid-until=no] https://snapshot.debian.org/archive/debian-security/20091004T121501Z/ lenny/updates main
```

想查找某个包的历史信息的话，可以在[官网](https://snapshot.debian.org/)搜索包名，或者手动翻目录。

<!-- > If you want anything related to a specific package simply enter the source package name in the form, or find it in the package index. -->

## 注意事项

- Debian snapshots 没有镜像源，需要加速的话可以使用 `apt-cacher-ng` 在本地搭建缓存。另外最好避免直接把 snapshot 源写进 docker 镜像里，不要给 snapshot 太大的压力。（[reddit 评论](https://www.reddit.com/r/debian/comments/14fl17r/comment/jp32oi0/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)）

- 2019 年 9 月 4 日 ～ 8 日的数据丢了（官网的 News 栏有写）。
